import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import MySQLdb
from django.apps import apps
from django.conf import settings
from django.core.management import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Export the legacy MySQL database and import it into a fresh SQLite database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sqlite-path",
            default=os.getenv("DB_SQLITE_PATH", "db.sqlite3"),
            help="Target SQLite file path. Relative paths are resolved from backend/.",
        )
        parser.add_argument("--mysql-name", default=os.getenv("MYSQL_SOURCE_NAME", ""))
        parser.add_argument("--mysql-user", default=os.getenv("MYSQL_SOURCE_USER", "root"))
        parser.add_argument("--mysql-password", default=os.getenv("MYSQL_SOURCE_PASSWORD", ""))
        parser.add_argument("--mysql-host", default=os.getenv("MYSQL_SOURCE_HOST", "localhost"))
        parser.add_argument("--mysql-port", default=os.getenv("MYSQL_SOURCE_PORT", "3306"))
        parser.add_argument(
            "--mysql-ssl",
            action="store_true",
            default=os.getenv("MYSQL_SOURCE_SSL", "False") == "True",
            help="Require SSL when connecting to the MySQL source database.",
        )
        parser.add_argument(
            "--fixture-path",
            default="",
            help="Optional path for the intermediate JSON export. Defaults to a temporary file.",
        )
        parser.add_argument(
            "--keep-fixture",
            action="store_true",
            help="Keep the intermediate JSON export instead of deleting it.",
        )

    def handle(self, *args, **options):
        mysql_name = options["mysql_name"].strip()
        if not mysql_name:
            raise CommandError("Set MYSQL_SOURCE_NAME or pass --mysql-name before running this command.")

        target_path = Path(options["sqlite_path"])
        if not target_path.is_absolute():
            target_path = settings.BASE_DIR / target_path
        target_path.parent.mkdir(parents=True, exist_ok=True)

        fixture_path = Path(options["fixture_path"]) if options["fixture_path"] else None
        if fixture_path and not fixture_path.is_absolute():
            fixture_path = settings.BASE_DIR / fixture_path

        if target_path.exists():
            backup_path = target_path.with_suffix(f"{target_path.suffix}.bak")
            shutil.copy2(target_path, backup_path)
            target_path.unlink()
            self.stdout.write(self.style.WARNING(f"Backed up existing SQLite database to {backup_path}"))

        temp_dir = None
        if fixture_path is None:
            temp_dir = Path(tempfile.mkdtemp(prefix="mysql-to-sqlite-"))
            fixture_path = temp_dir / "export.json"

        fixture_path.parent.mkdir(parents=True, exist_ok=True)
        manage_py = settings.BASE_DIR / "manage.py"

        self.stdout.write(f"Creating SQLite schema at {target_path} from Django migrations...")
        sqlite_env = os.environ.copy()
        sqlite_env.update(
            {
                "DB_ENGINE": "sqlite",
                "DB_SQLITE_PATH": str(target_path),
            }
        )
        self.run_manage_command(
            manage_py,
            ["migrate", "--noinput"],
            sqlite_env,
        )

        self.stdout.write(f"Exporting MySQL data from {mysql_name} into {fixture_path}...")
        mysql_schema = self.get_mysql_schema(
            name=mysql_name,
            user=options["mysql_user"],
            password=options["mysql_password"],
            host=options["mysql_host"],
            port=int(options["mysql_port"]),
        )
        dump_targets = self.get_dump_targets(mysql_schema)
        if not dump_targets:
            raise CommandError("No existing MySQL tables matched the installed Django models.")

        mysql_env = os.environ.copy()
        mysql_env.update(
            {
                "DB_ENGINE": "mysql",
                "DB_NAME": mysql_name,
                "DB_USER": options["mysql_user"],
                "DB_PASSWORD": options["mysql_password"],
                "DB_HOST": options["mysql_host"],
                "DB_PORT": str(options["mysql_port"]),
                "DB_SSL": "True" if options["mysql_ssl"] else "False",
            }
        )
        self.run_manage_command(
            manage_py,
            [
                "dumpdata",
                "--format=json",
                "--indent=2",
                f"--output={fixture_path}",
                *dump_targets,
            ],
            mysql_env,
        )

        self.stdout.write(f"Importing fixture into SQLite database at {target_path}...")
        self.run_manage_command(
            manage_py,
            ["loaddata", str(fixture_path)],
            sqlite_env,
        )

        if temp_dir and not options["keep_fixture"]:
            shutil.rmtree(temp_dir, ignore_errors=True)

        self.stdout.write(self.style.SUCCESS(f"SQLite export completed successfully: {target_path}"))

    def run_manage_command(self, manage_py, args, env):
        command = [sys.executable, str(manage_py), *args]
        try:
            subprocess.run(command, check=True, env=env)
        except subprocess.CalledProcessError as exc:
            raise CommandError(f"Command failed: {' '.join(command)}") from exc

    def get_mysql_schema(self, name, user, password, host, port):
        connection = MySQLdb.connect(
            db=name,
            user=user,
            passwd=password,
            host=host,
            port=port,
            charset="utf8mb4",
        )
        try:
            with connection.cursor() as cursor:
                cursor.execute("SHOW TABLES")
                tables = [row[0] for row in cursor.fetchall()]
                schema = {}
                for table in tables:
                    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
                    schema[table] = {row[0] for row in cursor.fetchall()}
                return schema
        finally:
            connection.close()

    def get_dump_targets(self, mysql_schema):
        excluded_labels = {
            "contenttypes.contenttype",
            "auth.permission",
            "admin.logentry",
            "sessions.session",
        }
        dump_targets = []
        for model in apps.get_models():
            if model._meta.proxy or not model._meta.managed:
                continue
            if model._meta.label_lower in excluded_labels:
                continue
            table_columns = mysql_schema.get(model._meta.db_table)
            if not table_columns:
                continue
            model_columns = {field.column for field in model._meta.local_concrete_fields}
            if model_columns.issubset(table_columns):
                dump_targets.append(model._meta.label_lower)
        return sorted(dump_targets)

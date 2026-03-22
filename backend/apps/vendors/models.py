from django.db import models


# Vendor-specific models (Vendor base in equipment.models)
class VendorKYC(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    vendor = models.OneToOneField("equipment.Vendor", on_delete=models.CASCADE, related_name='kyc')
    document_type = models.CharField(max_length=50, blank=True)
    document_url = models.URLField(max_length=500, blank=True)
    documents_verified = models.BooleanField(default=False)
    id_verified = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'vendor_kyc'
    
    def __str__(self):
        return f"KYC - {self.vendor.company_name} ({self.status})"


class VendorDispute(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('resolved', 'Resolved'),
        ('escalated', 'Escalated'),
    ]
    
    vendor = models.ForeignKey("equipment.Vendor", on_delete=models.CASCADE, related_name='disputes')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'vendor_disputes'
    
    def __str__(self):
        return f"Dispute #{self.id} - {self.vendor.company_name}"


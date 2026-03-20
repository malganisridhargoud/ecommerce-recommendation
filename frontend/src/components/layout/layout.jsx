import { Outlet, Link } from "react-router-dom";
import Navbar from "../common/Navbar";
import { AuthTokenProvider } from "../../auth/useAuthToken";
import { FiInstagram, FiTwitter, FiFacebook } from "react-icons/fi";

export default function Layout() {
  const year = new Date().getFullYear();

  return (
    <AuthTokenProvider>
      <div className="min-h-screen flex flex-col font-sans bg-[#f5f5f7] selection:bg-[#0071e3] selection:text-white pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 w-full bg-[#f5f5f7] pt-[120px] md:pt-[140px]">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Apple-Style Footer */}
        <footer className="bg-[#f5f5f7] border-t border-gray-200/80 text-[12px] text-[#6e6e73] mt-20">
          <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Footer Links Grid */}
            <div className="hidden md:grid grid-cols-5 gap-6 mb-10 pb-10 border-b border-gray-200/60">
              <div>
                <h4 className="font-semibold text-[#1d1d1f] text-xs mb-3 tracking-wide">Shop and Learn</h4>
                <ul className="space-y-2.5">
                  <li><Link to="/equipment?category=camera" className="hover:text-[#1d1d1f] transition-colors duration-200">Cameras</Link></li>
                  <li><Link to="/equipment?category=construction" className="hover:text-[#1d1d1f] transition-colors duration-200">Construction</Link></li>
                  <li><Link to="/equipment?category=industrial" className="hover:text-[#1d1d1f] transition-colors duration-200">Industrial</Link></li>
                  <li><Link to="/equipment?category=audio" className="hover:text-[#1d1d1f] transition-colors duration-200">Audio Equipment</Link></li>
                  <li><Link to="/equipment?category=vehicles" className="hover:text-[#1d1d1f] transition-colors duration-200">Vehicles</Link></li>
                  <li><Link to="/equipment?category=event" className="hover:text-[#1d1d1f] transition-colors duration-200">Event</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1d1d1f] text-xs mb-3 tracking-wide">Services</h4>
                <ul className="space-y-2.5">
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">TapRent Pro</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Equipment Repair</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Financing</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1d1d1f] text-xs mb-3 tracking-wide">Account</h4>
                <ul className="space-y-2.5">
                  <li><Link to="/buyer" className="hover:text-[#1d1d1f] transition-colors">Manage Your TapRent ID</Link></li>
                  <li><Link to="/buyer" className="hover:text-[#1d1d1f] transition-colors">TapRent Store Account</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1d1d1f] text-xs mb-3 tracking-wide">For Business</h4>
                <ul className="space-y-2.5">
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">TapRent and Business</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Shop for Business</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1d1d1f] text-xs mb-3 tracking-wide">About TapRent</h4>
                <ul className="space-y-2.5">
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Newsroom</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Investors</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Career Opportunities</span></li>
                  <li><span className="hover:text-[#1d1d1f] transition-colors cursor-pointer">Ethics & Compliance</span></li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex flex-col gap-4">
              <p className="text-[#6e6e73]">
                More ways to rent: <span className="text-[#0066cc] cursor-pointer hover:underline">Find a TapRent Store</span> or <span className="text-[#0066cc] cursor-pointer hover:underline">other supplier</span> near you. Or call 1-800-MY-TAPRENT.
              </p>
              <div className="border-t border-gray-200/60 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <p>Copyright © {year} TapRent Inc. All rights reserved.</p>
                <div className="flex flex-wrap gap-3 md:gap-5 text-[#6e6e73]">
                  {["Privacy Policy", "Terms of Use", "Sales and Refunds", "Legal", "Site Map"].map((item, i) => (
                    <span key={item} className="hover:text-[#1d1d1f] transition-colors cursor-pointer">{i > 0 && <span className="mr-3 md:mr-5 text-gray-300">|</span>}{item}</span>
                  ))}
                </div>
                <div className="flex gap-5 mt-2 md:mt-0 text-[#86868b]">
                  <FiTwitter className="w-4 h-4 hover:text-[#1d1d1f] cursor-pointer transition-colors" />
                  <FiInstagram className="w-4 h-4 hover:text-[#1d1d1f] cursor-pointer transition-colors" />
                  <FiFacebook className="w-4 h-4 hover:text-[#1d1d1f] cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthTokenProvider>
  );
}

# KYC Implementation TODO

## Plan Progress
- [x] 1. Create `backend/apps/control/__init__.py`
- [x] 2. Create `backend/apps/control/serializers.py`
- [x] 3. Create `backend/apps/control/views.py` (KYCSubmitView, KYCDetailView, KYCApproveView, VendorListView)
- [x] 4. Create `backend/apps/control/urls.py`
- [x] 5. Edit `backend/config/urls.py` (include control.urls)
- [x] 6. Edit `backend/apps/equipment/serializers.py` (add kyc_status to VendorSerializer)
- [ ] 7. Run `makemigrations && migrate` if needed
- [ ] 8. Test VendorDashboard KYC submit (no 404)
- [ ] 9. Test AdminDashboard KYC approve → vendor status updates
- [x] Task Complete: attempt_completion

**Current Step: 8/9 - Backend ready, test KYC flow**

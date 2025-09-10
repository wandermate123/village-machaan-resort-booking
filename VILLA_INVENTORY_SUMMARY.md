# Villa Inventory Summary

## Property Overview
- **Total Villas**: 3
- **Total Units**: 22
- **Check-in Time**: 1:30 PM
- **Check-out Time**: 11:30 AM

## Villa Details

### 1. Hornbill Villa
- **Units**: 4 (all 1 bedroom)
- **Unit Numbers**: HV-01, HV-02, HV-03, HV-04
- **Floors**: 2 floors (2 units per floor)
- **Views**: Forest View & Garden View
- **Max Occupancy**: 2 guests per unit
- **Amenities**: Air Conditioning, WiFi, Kitchen, Living Room, Private Bathroom, Balcony, Mini Fridge, Coffee Maker

### 2. Kingfisher Villa
- **Units**: 4 (all 1 bedroom)
- **Unit Numbers**: KF-01, KF-02, KF-03, KF-04
- **Floors**: 2 floors (2 units per floor)
- **Views**: Forest View & Garden View
- **Max Occupancy**: 2 guests per unit
- **Amenities**: Air Conditioning, WiFi, Kitchen, Living Room, Private Bathroom, Balcony, Mini Fridge, Coffee Maker

### 3. Glass Cottages
- **Units**: 14 (all 1 bedroom)
- **Unit Numbers**: GC-01 through GC-14
- **Floors**: 2 floors (7 units per floor)
- **Views**: Forest View & Garden View
- **Max Occupancy**: 2 guests per unit
- **Amenities**: Air Conditioning, WiFi, Private Bathroom, Glass Walls, Nature/Garden View, Mini Fridge, Coffee Maker, Reading Chair

## Room Allocation System Features

### ✅ Automatic Room Assignment
- New bookings automatically get assigned available rooms
- System prevents double-booking
- Handles date conflicts automatically

### ✅ Admin Room Management
- Dropdown in booking edit modal to select specific rooms
- Real-time room availability checking
- Room reassignment when booking details change
- Visual indicators for room status

### ✅ Accurate Occupancy Tracking
- Real room numbers displayed in occupancy views
- Proper unit counting based on actual assignments
- Real-time occupancy updates

## Database Tables Created

1. **villa_inventory** - Stores all room details
2. **booking_units** - Links bookings to specific rooms
3. **inventory_blocks** - Blocks rooms for maintenance

## Setup Instructions

1. Run `accurate-villa-inventory-setup.sql` in Supabase SQL Editor
2. The system will automatically create all tables and insert room data
3. Room allocation features will be immediately available

## Room Numbering System

- **Hornbill Villa**: HV-01, HV-02, HV-03, HV-04
- **Kingfisher Villa**: KF-01, KF-02, KF-03, KF-04
- **Glass Cottages**: GC-01 through GC-14

## Check-in/Check-out Times

- **Check-in**: 1:30 PM (13:30)
- **Check-out**: 11:30 AM (11:30)

All units are configured with these times in the database for consistency.



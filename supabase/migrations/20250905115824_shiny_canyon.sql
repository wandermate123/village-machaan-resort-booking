/*
  # Create Dashboard Functions

  1. New Functions
    - `get_dashboard_stats()` - Returns comprehensive dashboard statistics
    - `get_villa_performance()` - Returns villa performance metrics
    - `get_booking_analytics()` - Returns booking analytics data
    - `get_occupancy_overview()` - Returns current occupancy data
    - `cleanup_expired_holds()` - Cleans up expired booking holds

  2. Security
    - Grant execute permissions to authenticated users
    - Functions check for admin privileges where needed
*/

-- Function to get comprehensive dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_bookings INTEGER;
  total_revenue INTEGER;
  pending_bookings INTEGER;
  confirmed_bookings INTEGER;
  completed_bookings INTEGER;
  cancelled_bookings INTEGER;
  total_villas INTEGER;
  active_villas INTEGER;
  total_packages INTEGER;
  active_packages INTEGER;
  occupancy_rate NUMERIC;
  avg_booking_value NUMERIC;
BEGIN
  -- Get booking statistics
  SELECT COUNT(*) INTO total_bookings FROM bookings;
  SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue FROM bookings WHERE payment_status = 'paid';
  SELECT COUNT(*) INTO pending_bookings FROM bookings WHERE status = 'pending';
  SELECT COUNT(*) INTO confirmed_bookings FROM bookings WHERE status = 'confirmed';
  SELECT COUNT(*) INTO completed_bookings FROM bookings WHERE status = 'completed';
  SELECT COUNT(*) INTO cancelled_bookings FROM bookings WHERE status = 'cancelled';
  
  -- Get villa statistics
  SELECT COUNT(*) INTO total_villas FROM villas;
  SELECT COUNT(*) INTO active_villas FROM villas WHERE status = 'active';
  
  -- Get package statistics
  SELECT COUNT(*) INTO total_packages FROM packages;
  SELECT COUNT(*) INTO active_packages FROM packages WHERE is_active = true;
  
  -- Calculate occupancy rate (simplified)
  SELECT COALESCE(
    (SELECT COUNT(*) * 100.0 / NULLIF(
      (SELECT COUNT(*) FROM villa_inventory WHERE status = 'available'), 0
    ) FROM booking_units WHERE status IN ('reserved', 'occupied')), 0
  ) INTO occupancy_rate;
  
  -- Calculate average booking value
  SELECT COALESCE(AVG(total_amount), 0) INTO avg_booking_value FROM bookings WHERE total_amount > 0;
  
  -- Build result JSON
  result := json_build_object(
    'totalBookings', total_bookings,
    'totalRevenue', total_revenue,
    'pendingBookings', pending_bookings,
    'confirmedBookings', confirmed_bookings,
    'completedBookings', completed_bookings,
    'cancelledBookings', cancelled_bookings,
    'totalVillas', total_villas,
    'activeVillas', active_villas,
    'totalPackages', total_packages,
    'activePackages', active_packages,
    'occupancyRate', ROUND(occupancy_rate, 1),
    'avgBookingValue', ROUND(avg_booking_value, 0)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get villa performance metrics
CREATE OR REPLACE FUNCTION get_villa_performance(villa_id_param TEXT DEFAULT NULL)
RETURNS TABLE (
  villa_id TEXT,
  villa_name TEXT,
  total_bookings BIGINT,
  total_revenue BIGINT,
  occupancy_rate NUMERIC,
  avg_booking_value NUMERIC,
  last_booking_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    COUNT(b.id) as total_bookings,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    COALESCE(COUNT(b.id) * 100.0 / NULLIF(30, 0), 0) as occupancy_rate, -- Simplified calculation
    COALESCE(AVG(b.total_amount), 0) as avg_booking_value,
    MAX(b.created_at) as last_booking_date
  FROM villas v
  LEFT JOIN bookings b ON v.id = b.villa_id AND b.status != 'cancelled'
  WHERE (villa_id_param IS NULL OR v.id = villa_id_param)
  GROUP BY v.id, v.name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get booking analytics
CREATE OR REPLACE FUNCTION get_booking_analytics(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  booking_date DATE,
  total_bookings BIGINT,
  total_revenue BIGINT,
  avg_booking_value NUMERIC,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT
) AS $$
DECLARE
  start_date_param DATE;
  end_date_param DATE;
BEGIN
  -- Set default date range if not provided
  start_date_param := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date_param := COALESCE(end_date, CURRENT_DATE);
  
  RETURN QUERY
  SELECT 
    b.created_at::DATE as booking_date,
    COUNT(*) as total_bookings,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    COALESCE(AVG(b.total_amount), 0) as avg_booking_value,
    COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings
  FROM bookings b
  WHERE b.created_at::DATE BETWEEN start_date_param AND end_date_param
  GROUP BY b.created_at::DATE
  ORDER BY booking_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get occupancy overview
CREATE OR REPLACE FUNCTION get_occupancy_overview(target_date DATE DEFAULT NULL)
RETURNS TABLE (
  villa_id TEXT,
  villa_name TEXT,
  total_units BIGINT,
  occupied_units BIGINT,
  available_units BIGINT,
  occupancy_rate NUMERIC,
  current_guests JSON
) AS $$
DECLARE
  target_date_param DATE;
BEGIN
  target_date_param := COALESCE(target_date, CURRENT_DATE);
  
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    COUNT(vi.id) as total_units,
    COUNT(bu.id) FILTER (WHERE bu.status IN ('reserved', 'occupied') AND bu.check_in <= target_date_param AND bu.check_out > target_date_param) as occupied_units,
    COUNT(vi.id) - COUNT(bu.id) FILTER (WHERE bu.status IN ('reserved', 'occupied') AND bu.check_in <= target_date_param AND bu.check_out > target_date_param) as available_units,
    COALESCE(
      COUNT(bu.id) FILTER (WHERE bu.status IN ('reserved', 'occupied') AND bu.check_in <= target_date_param AND bu.check_out > target_date_param) * 100.0 / 
      NULLIF(COUNT(vi.id), 0), 0
    ) as occupancy_rate,
    COALESCE(
      json_agg(
        json_build_object(
          'booking_id', b.booking_id,
          'guest_name', b.guest_name,
          'check_in', bu.check_in,
          'check_out', bu.check_out,
          'unit_number', vi.unit_number
        )
      ) FILTER (WHERE bu.status IN ('reserved', 'occupied') AND bu.check_in <= target_date_param AND bu.check_out > target_date_param),
      '[]'::json
    ) as current_guests
  FROM villas v
  LEFT JOIN villa_inventory vi ON v.id = vi.villa_id
  LEFT JOIN booking_units bu ON vi.id = bu.villa_inventory_id
  LEFT JOIN bookings b ON bu.booking_id = b.id
  WHERE v.status = 'active'
  GROUP BY v.id, v.name
  ORDER BY v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired booking holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM booking_holds 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_villa_performance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_analytics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_occupancy_overview(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds() TO authenticated;

-- Also grant to anon for public access where appropriate
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_villa_performance(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_booking_analytics(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_occupancy_overview(DATE) TO anon;
-- User roles (stored as JWT claim)
CREATE TYPE user_role           AS ENUM ('customer', 'employee', 'admin');

-- Appointment lifecycle
CREATE TYPE appointment_type    AS ENUM ('evaluation', 'delivery', 'follow_up');
CREATE TYPE appointment_status  AS ENUM ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Order lifecycle
CREATE TYPE order_status        AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Actions recorded during a visit
CREATE TYPE visit_action        AS ENUM ('found', 'delivered', 'recommended', 'removed', 'expired');

-- Follow-up scheduling interval
CREATE TYPE follow_up_interval  AS ENUM ('monthly', 'quarterly', 'biannual', 'annual');

-- JIA Apartamentos - Maintenance Tracking System
-- Supabase SQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create UNITS table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_number VARCHAR(50) NOT NULL,
  building VARCHAR(100) NOT NULL,
  floor INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create TICKETS table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'Plomería',
    'Eléctrico',
    'Electrodomésticos',
    'Aire Acondicionado/Calefacción',
    'Estructural',
    'Cerrajería',
    'Otro'
  )),
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Abierto' CHECK (status IN (
    'Abierto',
    'Asignado',
    'Reparado',
    'Verificado'
  )),
  assigned_worker VARCHAR(100),
  work_description TEXT,
  completion_date DATE,
  labor_cost NUMERIC(12, 2) DEFAULT 0,
  materials_cost NUMERIC(12, 2) DEFAULT 0,
  materials_description TEXT,
  tax_percentage INTEGER DEFAULT 19,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  is_deductible BOOLEAN DEFAULT TRUE,
  verification_status VARCHAR(50) DEFAULT 'No verificado' CHECK (verification_status IN (
    'No verificado',
    'Pendiente inmobiliaria',
    'Verificado'
  )),
  verification_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create TICKET_ATTACHMENTS table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('foto', 'recibo')),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);

-- Create AUTH_USERS table (tracks user logins)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_tickets_unit_id ON tickets(unit_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_report_date ON tickets(report_date);
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- Create materialized view for unit cost summary
CREATE VIEW unit_cost_summary AS
SELECT 
  u.id,
  u.unit_number,
  u.building,
  u.floor,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN t.status = 'Abierto' THEN 1 END) as open_tickets,
  COALESCE(SUM(t.labor_cost + t.materials_cost + t.tax_amount), 0) as total_spent,
  COALESCE(SUM(CASE WHEN t.created_at::date >= DATE_TRUNC('month', NOW())::date THEN t.labor_cost + t.materials_cost + t.tax_amount ELSE 0 END), 0) as spent_this_month
FROM units u
LEFT JOIN tickets t ON u.id = t.unit_id
GROUP BY u.id, u.unit_number, u.building, u.floor;

-- Create RLS policies
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for units (authenticated users can read all, but not modify for now)
CREATE POLICY "Allow authenticated users to read units"
  ON units FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS policies for tickets (authenticated users can do all operations)
CREATE POLICY "Allow authenticated users to read tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (TRUE);

-- RLS policies for attachments
CREATE POLICY "Allow authenticated users to read attachments"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to insert attachments"
  ON ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to delete attachments"
  ON ticket_attachments FOR DELETE
  TO authenticated
  USING (TRUE);

-- RLS policies for auth_users
CREATE POLICY "Allow authenticated users to read auth_users"
  ON auth_users FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow users to insert their own auth_users record"
  ON auth_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own auth_users record"
  ON auth_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate tax amount automatically
CREATE OR REPLACE FUNCTION calculate_ticket_tax()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tax_amount = ROUND(((NEW.labor_cost + NEW.materials_cost) * NEW.tax_percentage / 100)::numeric, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ticket_tax_on_insert BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION calculate_ticket_tax();

CREATE TRIGGER calculate_ticket_tax_on_update BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION calculate_ticket_tax();

-- Insert sample units (optional - remove after testing)
-- These are examples only - adjust to your actual units
INSERT INTO units (unit_number, building, floor, notes) VALUES
  ('4B', 'Edificio Norte', 4, 'Calentador nuevo 2024'),
  ('7C', 'Edificio Sur', 7, 'Unidad con historial de problemas de plomería'),
  ('12', 'Edificio Norte', 2, NULL),
  ('3A', 'Edificio Sur', 3, NULL),
  ('5D', 'Edificio Norte', 5, NULL)
ON CONFLICT DO NOTHING;

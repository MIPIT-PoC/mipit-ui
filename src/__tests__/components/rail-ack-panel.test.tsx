import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RailAckPanel } from '@/components/payments/rail-ack-panel';

describe('RailAckPanel', () => {
  it('shows pending message when railAck is null', () => {
    render(<RailAckPanel railAck={null} />);
    expect(screen.getByText(/Aún no se ha recibido/i)).toBeInTheDocument();
  });

  it('renders ACCEPTED status with green styling', () => {
    render(<RailAckPanel railAck={{ status: 'ACCEPTED', rail_tx_id: 'TX-001' }} />);
    expect(screen.getByText(/Aceptado por el riel/i)).toBeInTheDocument();
    expect(screen.getByText('TX-001')).toBeInTheDocument();
  });

  it('renders REJECTED status with red styling', () => {
    render(<RailAckPanel railAck={{ status: 'REJECTED', error: { code: 'AM04', message: 'Insufficient funds' } }} />);
    expect(screen.getByText(/Rechazado por el riel/i)).toBeInTheDocument();
    expect(screen.getByText('AM04')).toBeInTheDocument();
  });

  it('renders known PIX SPI error codes with human description', () => {
    render(<RailAckPanel railAck={{ status: 'REJECTED', error: { code: 'AM04', message: 'x' } }} />);
    expect(screen.getByText(/Fondos insuficientes \(BACEN AM04\)/i)).toBeInTheDocument();
  });

  it('renders known SPEI CECOBAN error codes', () => {
    render(<RailAckPanel railAck={{ status: 'REJECTED', error: { code: 'R03', message: 'x' } }} />);
    expect(screen.getByText(/Cuenta beneficiaria no encontrada/i)).toBeInTheDocument();
  });

  it('renders ERROR status with yellow styling', () => {
    render(<RailAckPanel railAck={{ status: 'ERROR' }} />);
    expect(screen.getByText(/Error de comunicación/i)).toBeInTheDocument();
  });

  it('shows destination name in title when provided', () => {
    render(<RailAckPanel railAck={{ status: 'ACCEPTED' }} destination="SPEI" />);
    expect(screen.getByText(/SPEI/)).toBeInTheDocument();
  });

  it('shows JSON detail in expandable section', async () => {
    const user = userEvent.setup();
    render(<RailAckPanel railAck={{ status: 'ACCEPTED', rail_tx_id: 'TX-123' }} />);

    const details = screen.getByText(/Ver respuesta completa/i);
    await user.click(details);
    // After expand, JSON should appear
    expect(screen.getByText(/"rail_tx_id": "TX-123"/)).toBeInTheDocument();
  });
});

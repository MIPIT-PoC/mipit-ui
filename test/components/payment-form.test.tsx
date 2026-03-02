import { describe, it, expect } from 'vitest';

describe('PaymentForm', () => {
  it.todo('renders rail selectors for origin and destination');
  it.todo('displays PIX form fields when origin rail is PIX');
  it.todo('displays SPEI form fields when origin rail is SPEI');
  it.todo('validates required fields before submission');
  it.todo('calls createPayment API on valid submit');
  it.todo('disables submit button while loading');
  it.todo('redirects to payment detail on success');
  it.todo('shows error toast on API failure');
});

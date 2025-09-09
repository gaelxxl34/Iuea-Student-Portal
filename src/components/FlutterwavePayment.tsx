// TEMPORARILY DISABLED - FLUTTERWAVE PAYMENT INTEGRATION NOT READY
// TODO: Re-enable when payment system is ready for production

// Placeholder interfaces for compatibility
export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: {
    application_id?: string;
    payment_type?: 'application_fee' | 'tuition' | 'other';
    student_id?: string;
  };
}

export interface PaymentResponse {
  status: 'successful' | 'cancelled' | 'failed';
  transaction_id: string;
  tx_ref: string;
  flw_ref?: string;
  amount?: number;
  currency?: string;
  charged_amount?: number;
  app_fee?: number;
  merchant_fee?: number;
  processor_response?: string;
  auth_model?: string;
  ip?: string;
  narration?: string;
  status_message?: string;
  validation_required?: boolean;
  payment_type?: string;
  fraud_status?: string;
  charge_type?: string;
  is_live?: boolean;
  created_at?: string;
  account_id?: number;
  customer?: {
    id: number;
    name: string;
    phone_number: string;
    email: string;
    created_at: string;
  };
}

// Disabled Flutterwave Payment component
export default function FlutterwavePayment() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <i className="ri-alert-line text-amber-600 text-2xl mr-3"></i>
        <div>
          <h3 className="text-amber-800 font-semibold">Payment System Temporarily Disabled</h3>
          <p className="text-amber-700 text-sm">The payment system is currently being prepared and is not ready for use.</p>
        </div>
      </div>
      <p className="text-amber-600 text-sm">Please complete your application without payment for now. Payment processing will be available soon.</p>
    </div>
  );
}

// Disabled Payment Options component
interface PaymentOptionProps {
  applicationFee: number;
  currency: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  applicationId: string;
  onPaymentSuccess: (response: PaymentResponse, paymentType: 'pay_now' | 'pay_later') => void;
  onCancel: () => void;
}

export function PaymentOptions({ onCancel }: PaymentOptionProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-pause-circle-line text-2xl text-amber-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-amber-800 mb-2">
          Payment System Not Ready
        </h3>
        <p className="text-amber-700">
          We&apos;re preparing the payment system for launch. You can complete your application without payment for now.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
          <div>
            <h4 className="text-blue-800 font-medium">What this means:</h4>
            <ul className="text-blue-700 text-sm mt-2 space-y-1 ml-4">
              <li>&bull; You can submit your application without payment</li>
              <li>&bull; Payment options will be available soon</li>
              <li>&bull; Your application will be processed normally</li>
              <li>&bull; You&apos;ll be notified when payment is ready</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Continue Without Payment
        </button>
      </div>
    </div>
  );
}

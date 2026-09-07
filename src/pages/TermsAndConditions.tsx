const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-800 mb-6">Terms and Conditions</h1>
      <div className="space-y-4 text-gray-600 leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <p>
          Please read these terms and conditions carefully before using the ShiftPay application operated by us.
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">1. Conditions of Use</h2>
        <p>
          By using this application, you certify that you have read and reviewed this Agreement and that you agree to comply with its terms. 
          If you do not want to be bound by the terms of this Agreement, you are advised to leave the application accordingly. 
          ShiftPay only grants use and access of this application, its products, and its services to those who have accepted its terms.
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">2. Privacy Policy</h2>
        <p>
          Before you continue using our application, we advise you to read our privacy policy regarding our user data collection. 
          It will help you better understand our practices.
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">3. User Accounts</h2>
        <p>
          As a user of this application, you may be asked to register with us and provide private information. 
          You are responsible for ensuring the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information.
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">4. Acceptable Use</h2>
        <p>
          You agree not to use the application for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the application in any way that could damage the application, the services, or the general business of ShiftPay.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-800 mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-gray-600 leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <p>
          Welcome to ShiftPay. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our application 
          and tell you about your privacy rights and how the law protects you.
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">1. The data we collect about you</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
          </ul>
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">2. How we use your personal data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          <ul className="list-disc ml-6 mt-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
        </p>
        <h2 className="text-xl font-bold text-gray-800 mt-6">3. Data security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

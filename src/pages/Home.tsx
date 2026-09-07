const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold text-teal-800 mb-4">ShiftPay</h1>
      <p className="text-center max-w-lg mb-6 text-gray-600">
        ShiftPay is an employee attendance and salary management application. 
        It helps managers track their employees' shifts, mark attendance via QR codes, and automatically calculate salaries based on predefined roles and wages.
      </p>
      <a href="/login" className="bg-teal-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-800 transition">
        Go to Login
      </a>
    </div>
  );
};

export default Home;

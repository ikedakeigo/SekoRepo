const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

import TopNavbar from "@/components/TopNavbar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <TopNavbar />
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;

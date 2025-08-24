import { Outlet } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar.jsx";

export default function Layout() {
  return (
    <div className="">
      <Sidebar />
      <main className="lg:w-[calc(100%-16rem)] lg:mr-auto p-10">
        <Outlet />
      </main>
    </div>
  );
}

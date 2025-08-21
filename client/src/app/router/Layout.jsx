import { Outlet } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar.jsx";

export default function Layout() {
  return (
    <div className="">
      <Sidebar />
      <main className="md:w-[calc(100%-16rem)] md:mr-auto p-10">
        <Outlet />
      </main>
    </div>
  );
}

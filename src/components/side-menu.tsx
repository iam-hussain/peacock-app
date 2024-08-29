
import MenuItems from "./menu-items";

function SideMenu({ className }: { className?: string }) {

  return (
    <div className={
      "h-full min-h-svh hidden lg:flex bg-background w-[350px] transition-all duration-300 p-6 pt-[100px]"
    }>
      <MenuItems />
    </div>

  );
}

export default SideMenu;

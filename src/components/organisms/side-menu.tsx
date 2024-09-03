import MenuItems from "./menu-items";

function SideMenu() {
  return (
    <div
      className={
        "h-full min-h-svh hidden fixed lg:flex bg-background w-[300px] shadow-sm transition-all duration-300 p-6 pt-[90px]"
      }
    >
      <MenuItems />
    </div>
  );
}

export default SideMenu;

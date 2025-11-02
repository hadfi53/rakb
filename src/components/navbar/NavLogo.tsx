import { Link } from "react-router-dom";

export const NavLogo = () => {
  return (
    <Link 
      to="/" 
      className="flex items-center justify-center md:justify-start text-xl sm:text-2xl font-bold"
    >
      <span className="text-black">
        RAKB
      </span>
    </Link>
  );
};

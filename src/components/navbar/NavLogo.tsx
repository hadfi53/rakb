import { Link } from "react-router-dom";

export const NavLogo = () => {
  return (
    <Link 
      to="/" 
      className="flex items-center justify-center md:justify-start text-2xl sm:text-3xl font-bold"
    >
      <span className="text-black">
        RAKB
      </span>
    </Link>
  );
};

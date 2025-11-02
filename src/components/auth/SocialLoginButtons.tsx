
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export const SocialLoginButtons = () => {
  return (
    <>
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-3 text-gray-400 text-xs md:text-sm">ou continuer avec</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Button variant="outline" className="w-full py-2 text-xs md:text-sm" type="button">
          <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Google
        </Button>
        <Button variant="outline" className="w-full py-2 text-xs md:text-sm" type="button">
          <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" viewBox="0 0 24 24">
            <path
              d="M9.03954 11.0141C9.03954 8.41642 10.8719 7.42261 12.7804 7.42261C13.7935 7.42261 14.6066 7.80087 15.1866 8.28543L17.0384 6.45043C15.8647 5.36739 14.3592 4.67651 12.7804 4.67651C9.74692 4.67651 6.97341 7.06208 6.97341 11.0141C6.97341 14.9661 9.74692 17.3516 12.7804 17.3516C14.4489 17.3516 15.8647 16.7501 16.9487 15.5776C18.1224 14.4051 18.5125 12.7489 18.5125 11.3834C18.5125 10.7818 18.4446 10.3036 18.3467 9.92532H12.7804V12.5625H16.0018C15.8647 13.5068 15.3644 14.2472 14.7146 14.7318C14.1844 15.1506 13.4154 15.5199 12.7804 15.5199C10.5514 15.5199 9.03954 13.7934 9.03954 11.0141Z"
              fill="currentColor"
            />
          </svg>
          Facebook
        </Button>
      </div>

      <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 mt-4">
        <Shield className="w-3 h-3 md:w-4 md:h-4" />
        <span className="text-xs">Inscription sécurisée via SSL</span>
      </div>
    </>
  );
};

import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const showToast = (type, message, description) => {
  console.log({description});
  console.log({message});
  
  const toastConfig = {
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      backgroundColor: "var(--success-bg)",
      color: "var(--success-text)",
      border: "1px solid var(--success-border)",
    },
    error: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      backgroundColor: "var(--error-bg)",
      color: "var(--error-text)",
      border: "1px solid var(--error-border)",
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      backgroundColor: "var(--warning-bg)",
      color: "var(--warning-text)",
      border: "1px solid var(--warning-border)",
    },
  };

  toast[type](message, {
    description: (
      <span>
        {description}
      </span>
    ),
    icon: toastConfig[type].icon,
    style: {
      backgroundColor: toastConfig[type].backgroundColor,
      color: toastConfig[type].color,
      border: toastConfig[type].border,
    },
  });
};
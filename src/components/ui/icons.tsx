import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function makeIcon(path: React.ReactNode) {
  return function Icon({ size = 20, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const Home = makeIcon(<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />);
export const Users = makeIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
);
export const MessageSquare = makeIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
export const Send = makeIcon(<path d="m22 2-7 20-4-9-9-4Z M22 2 11 13" />);
export const Plus = makeIcon(<path d="M12 5v14M5 12h14" />);
export const X = makeIcon(<path d="M18 6 6 18M6 6l12 12" />);
export const Search = makeIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>,
);
export const Check = makeIcon(<path d="M20 6 9 17l-5-5" />);
export const CheckCheck = makeIcon(<path d="M18 6 7 17l-5-5M22 6 11 17l-1.5-1.5" />);
export const SkipForward = makeIcon(
  <>
    <path d="m5 4 10 8-10 8Z" />
    <path d="M19 5v14" />
  </>,
);
export const ChevronRight = makeIcon(<path d="m9 18 6-6-6-6" />);
export const ChevronLeft = makeIcon(<path d="m15 18-6-6 6-6" />);
export const ArrowLeft = makeIcon(<path d="M19 12H5M12 19l-7-7 7-7" />);
export const Upload = makeIcon(
  <>
    <path d="M12 3v12" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 21h14" />
  </>,
);
export const Download = makeIcon(
  <>
    <path d="M12 21V9" />
    <path d="m7 16 5 5 5-5" />
    <path d="M5 3h14" />
  </>,
);
export const Edit = makeIcon(
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </>,
);
export const Trash = makeIcon(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-.9 14a2 2 0 0 1-2 1.9H7.9a2 2 0 0 1-2-1.9L5 6" />
  </>,
);
export const Copy = makeIcon(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
);
export const Archive = makeIcon(
  <>
    <rect x="2" y="4" width="20" height="5" rx="1" />
    <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
    <path d="M10 13h4" />
  </>,
);
export const MoreVertical = makeIcon(
  <>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>,
);
export const Phone = makeIcon(
  <path d="M13.4 10.6a7 7 0 0 0 2.3 2.3l1.5-1.5a1 1 0 0 1 1-.24 8 8 0 0 0 2.5.4 1 1 0 0 1 1 1V16a1 1 0 0 1-1 1A16 16 0 0 1 4 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 8 8 0 0 0 .4 2.5 1 1 0 0 1-.25 1Z" />,
);
export const Play = makeIcon(<path d="M6 4v16l14-8Z" />);
export const Pause = makeIcon(
  <>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </>,
);
export const FileSpreadsheet = makeIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h8M8 13v4" />
  </>,
);
export const Sparkles = makeIcon(
  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
);
export const Inbox = makeIcon(
  <>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </>,
);
export const Folder = makeIcon(
  <path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />,
);
export const Settings = makeIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </>,
);
export const UserPlus = makeIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </>,
);
export const ContactImport = makeIcon(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m9 10 3-3 3 3" />
    <path d="M12 7v8" />
  </>,
);

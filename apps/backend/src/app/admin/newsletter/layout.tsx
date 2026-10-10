
import { ReactNode } from "react";

export default function NewsletterLayout({ children }: { children: ReactNode }) {
    return (
        // The main page now handles the layout, this file is just a wrapper
        <>{children}</>
    )
}

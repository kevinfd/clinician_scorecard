import { Shell, NotAuthorized } from "@/components/Shell";
import { viewer } from "@/lib/session";

// Same bytes as "not yours": a missing resource and a forbidden one read identically.
export default async function NotFound() {
  const v = await viewer();
  return <Shell viewer={v}><NotAuthorized /></Shell>;
}

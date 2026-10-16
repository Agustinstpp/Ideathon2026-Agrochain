import Image from "next/image";
import logo from "./logo.png";

export function Logo({ size = 42 }: { size?: number }) {
  return <Image src={logo} alt="AgroChain" width={size} height={size} className="brand-logo" priority />;
}

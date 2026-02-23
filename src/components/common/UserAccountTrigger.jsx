import React from "react";
import { useContextElement } from "@/context/Context";

export default function UserAccountTrigger() {
  const { user } = useContextElement();
  const target = user ? "userMenu" : "login";
  return (
    <li className="nav-account">
      <a
        href={`#${target}`}
        data-bs-toggle="offcanvas"
        aria-controls={target}
        className="nav-icon-item"
      >
        <i className="icon icon-user" />
      </a>
    </li>
  );
}

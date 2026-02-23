import React from "react";
import { useContextElement } from "@/context/Context";

export default function UserMenu() {
  const { user, logout } = useContextElement();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    document.querySelector("#userMenu .icon-close-popup")?.click();
  };

  return (
    <div
      className="offcanvas offcanvas-end popup-style-1 popup-login"
      id="userMenu"
      tabIndex="-1"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">Minha conta</span>
          <button
            type="button"
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Fechar"
          />
        </div>
        <div className="canvas-body popup-inner">
          <div className="mb_12">
            <p className="text-sm text-main-2 mb_8">
              {user.name ? (
                <>
                  <strong>{user.name}</strong>
                  <br />
                </>
              ) : null}
              <span>{user.email}</span>
            </p>
          </div>
          <div className="button-wrap">
            <button
              type="button"
              className="tf-btn btn-out-line-dark2 w-100"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

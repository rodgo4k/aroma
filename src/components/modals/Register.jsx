import React, { useState } from "react";
import { register as apiRegister, setStoredToken } from "@/api/auth";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || undefined;
      const data = await apiRegister({ email: email.trim(), password, name });
      setStoredToken(data.token);
      document.querySelector("#register .icon-close-popup")?.click();
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="offcanvas offcanvas-end popup-style-1 popup-register"
      id="register"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">Create account</span>
          <button
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body popup-inner">
          <form onSubmit={handleSubmit} className="form-login">
            {error && (
              <div className="alert alert-danger text-sm mb_12" role="alert">
                {error}
              </div>
            )}
            <div className="">
              <fieldset className="text mb_12">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </fieldset>
              <fieldset className="text mb_12">
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </fieldset>
              <fieldset className="email mb_12">
                <input
                  type="email"
                  placeholder="Email*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </fieldset>
              <fieldset className="password">
                <input
                  type="password"
                  placeholder="Password*"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </fieldset>
            </div>
            <div className="bot">
              <p className="text text-sm text-main-2">
                Sign up for early Sale access plus tailored new arrivals, trends
                and promotions. To opt out, click unsubscribe in our emails.
              </p>
              <div className="button-wrap">
                <button
                  className="subscribe-button tf-btn animate-btn bg-dark-2 w-100"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Criando conta…" : "Sign up"}
                </button>
                <button
                  type="button"
                  data-bs-target="#login"
                  data-bs-toggle="offcanvas"
                  className="tf-btn btn-out-line-dark2 w-100"
                >
                  Sign in
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";
import { Link } from "react-router-dom";

import {
  blogMenuItems,
  demoItems,
  otherPages,
  productMenuItems,
  shopPages,
} from "@/data/menu";
import { useLocation } from "react-router-dom";
import LanguageSelect from "../common/LanguageSelect";
import CurrencySelect from "../common/CurrencySelect";
import { useContextElement } from "@/context/Context";

export default function MobileMenu() {
  const { pathname } = useLocation();
  const { user } = useContextElement();
  const accountTarget = user ? "userMenu" : "login";
  const isAdmin = user?.role === "admin";
  const isMenuActive = (link) => {
    return link.href?.split("/")[1] == pathname.split("/")[1];
  };
  const isMenuParentActive = (menu) => {
    return menu.some((elm) => isMenuActive(elm));
  };
  const isMenuParentActive2 = (menu) => {
    return menu.some((elm) => isMenuParentActive(elm.links));
  };
  return (
    <div className="offcanvas offcanvas-start canvas-mb" id="mobileMenu">
      <button
        className="icon-close icon-close-popup"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      />
      <div className="mb-canvas-content">
        <div className="mb-body">
          <div className="mb-content-top">
            <form className="form-search">
              <input
                type="text"
                placeholder="Procurar produto"
                className=""
                name="text"
                tabIndex={0}
                defaultValue=""
                aria-required="true"
                required
              />
              <button type="submit">
                <i className="icon icon-search" />
              </button>
            </form>
            <ul className="nav-ul-mb" id="wrapper-menu-navigation">
              <li className="nav-mb-item">
              <Link
                to="/"
                className={`mb-menu-link ${pathname === "/" ? "menuActive" : ""}`}
                data-bs-dismiss="offcanvas"
              >
                <span>Início</span>
              </Link>
                {/* <div id="dropdown-menu-home" className="collapse">
                  <ul className="sub-nav-menu">
                    {demoItems.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={link.href}
                          className={`sub-nav-link ${
                            isMenuActive(link) ? "menuActive" : ""
                          }`}
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div> */}
              </li>
              <li className="nav-mb-item">
                <Link
                  to="/"
                  className={`mb-menu-link ${pathname === "/catalogo" ? "menuActive" : ""}`}
                  data-bs-dismiss="offcanvas"
                >
                  <span>Catálogo</span>
                </Link>
                {/* <div id="dropdown-menu-shop" className="collapse">
                  <ul className="sub-nav-menu">
                    {shopPages.map((elm, i) => (
                      <li key={i}>
                        <a
                          href={`#sub-shop-layout${i}`}
                          className={`sub-nav-link collapsed  ${
                            isMenuParentActive(elm.links) ? "menuActive" : ""
                          } `}
                          data-bs-toggle="collapse"
                          aria-expanded="true"
                          aria-controls={`sub-shop-layout${i}`}
                        >
                          <span>{elm.heading}</span>
                          <span className="btn-open-sub" />
                        </a>
                        <div id={`sub-shop-layout${i}`} className="collapse">
                          <ul className="sub-nav-menu sub-menu-level-2">
                            {elm.links.map((link, i) => (
                              <li key={i}>
                                <Link
                                  to={link.href2 ? link.href2 : link.href}
                                  className={`sub-nav-link  ${
                                    isMenuActive(link) ? "menuActive" : ""
                                  }`}
                                >
                                  {link.text}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div> */}
              </li>
              {/* <li className="nav-mb-item">
                <a
                  href="#dropdown-menu-product"
                  className={`collapsed mb-menu-link ${
                    isMenuParentActive2(productMenuItems) ? "menuActive" : ""
                  } `}
                  data-bs-toggle="collapse"
                  aria-expanded="true"
                  aria-controls="dropdown-menu-product"
                >
                  <span>Products</span>
                  <span className="btn-open-sub" />
                </a>
                <div id="dropdown-menu-product" className="collapse">
                  <ul className="sub-nav-menu">
                    {productMenuItems.map((elm, i) => (
                      <li key={i}>
                        <a
                          href={`#sub-product-layout${i}`}
                          className={`sub-nav-link collapsed  ${
                            isMenuParentActive(elm.links) ? "menuActive" : ""
                          } `}
                          data-bs-toggle="collapse"
                          aria-expanded="true"
                          aria-controls={`sub-product-layout${i}`}
                        >
                          <span>{elm.heading}</span>
                          <span className="btn-open-sub" />
                        </a>
                        <div id={`sub-product-layout${i}`} className="collapse">
                          <ul className="sub-nav-menu sub-menu-level-2">
                            {elm.links.map((link, i) => (
                              <li key={i}>
                                <Link
                                  to={link.href}
                                  className={`sub-nav-link  ${
                                    isMenuActive(link) ? "menuActive" : ""
                                  }`}
                                >
                                  {link.text}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li> */}
              <li className="nav-mb-item">
                <Link
                  to="/"
                  className={`mb-menu-link ${pathname === "/about-us" ? "menuActive" : ""}`}
                  data-bs-dismiss="offcanvas"
                >
                  <span>Sobre Nós</span>
                </Link>
                {/* <div id="dropdown-menu-pages" className="collapse">
                  <ul className="sub-nav-menu">
                    {otherPages.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={link.href}
                          className={`sub-nav-link  ${
                            isMenuActive(link) ? "menuActive" : ""
                          }`}
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div> */}
              </li>
              <li className="nav-mb-item">
                <Link
                  to="/"
                  className={`mb-menu-link ${pathname === "/contact-us" ? "menuActive" : ""}`}
                  data-bs-dismiss="offcanvas"
                >
                  <span>Contato</span>
                </Link>
              </li>
              {/* <li className="nav-mb-item">
                <a
                  href="#dropdown-menu-blog"
                  className={`collapsed mb-menu-link  ${
                    isMenuParentActive(blogMenuItems) ? "menuActive" : ""
                  } `}
                  data-bs-toggle="collapse"
                  aria-expanded="true"
                  aria-controls="dropdown-menu-blog"
                >
                  <span>Blog</span>
                  <span className="btn-open-sub" />
                </a>
                <div id="dropdown-menu-blog" className="collapse">
                  <ul className="sub-nav-menu">
                    {blogMenuItems.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={link.href}
                          className={`sub-nav-link  ${
                            isMenuActive(link) ? "menuActive" : ""
                          }`}
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li> */}
              {isAdmin && (
                <li className="nav-mb-item">
                  <Link
                    to="/painel"
                    className={`mb-menu-link ${
                      pathname.startsWith("/painel") ? "menuActive" : ""
                    }`}
                  >
                    Painel de Controle
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div className="mb-other-content">
            <div className="group-icon">
              <Link to={`/wish-list`} className="site-nav-icon">
                <i className="icon icon-heart" />
                Favoritos
              </Link>
              <a
                href={`#${accountTarget}`}
                data-bs-toggle="offcanvas"
                className="site-nav-icon"
              >
                <i className="icon icon-user" />
                {user ? "Minha conta" : "Login"}
              </a>
            </div>
            
          </div>
        </div>
        <div className="mb-bottom">
          <div className="bottom-bar-language">
            <div className="tf-currencies">
              <CurrencySelect />
            </div>
            <div className="tf-languages">
              <LanguageSelect parentClassName="image-select center style-default type-languages" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

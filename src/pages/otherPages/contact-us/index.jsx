import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar2 from "@/components/headers/Topbar2";
import Contact from "@/components/otherPages/Contact";
import React from "react";
import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";

const metadata = {
  title: "Contato | Aroma",
  description: "Fale com a equipe Aroma para dúvidas, sugestões ou suporte.",
};

export default function ContactusPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
      <Header1 />
      <Breadcumb pageName="Contato" pageTitle="Contato" />
      <Contact />
      <Footer1 />
    </>
  );
}

import Orders from "@/components/dashboard/Orders";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar2 from "@/components/headers/Topbar2";
import OrderDetails from "@/components/modals/OrderDetails";
import React from "react";

import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";

const metadata = {
  title: "Meus pedidos || Aroma Expresso",
  description: "Veja o histórico dos seus pedidos na Aroma Expresso.",
};

export default function AccountOrderPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Topbar2 parentClass="tf-topbar bg-dark-5 topbar-bg" />
      <Header1 />
      <Breadcumb pageName="Pedidos" pageTitle="Meus pedidos" />
      <Orders />
      <Footer1 />
      <OrderDetails />
    </>
  );
}

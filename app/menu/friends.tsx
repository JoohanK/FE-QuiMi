import FriendList from "@/components/FriendList";
import React from "react";
import TitleComponent from "@/components/TitleComponent";
import ContainerComponent from "@/components/ContainerComponent";

export default function Friends() {
  return (
    <>
      <ContainerComponent>
        <TitleComponent>Friends</TitleComponent>
        <FriendList />
      </ContainerComponent>
    </>
  );
}

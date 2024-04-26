import { FunctionComponent } from "preact";
import { Video } from "./video";

export const App: FunctionComponent = () => {
  return (
    <div className="app-container">
      <h1>Try not to laugh!</h1>
      <Video videoId="-YO14FM76lY" />
      <Video videoId="2rvWH0g_LoA" />
      <Video videoId="DHfRfU3XUEo" />
    </div>
  );
};

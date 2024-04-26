import { FunctionComponent } from "preact";

interface VideoProps {
  videoId: string;
}

export const Video: FunctionComponent<VideoProps> = ({ videoId }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="video-container">
      <iframe
        src={embedUrl}
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
      ></iframe>
    </div>
  );
};

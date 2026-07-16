export default function VideoEmbed({ youtubeVideoId, title }: { youtubeVideoId: string; title: string }) {
  return (
    <div className="video-embed">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

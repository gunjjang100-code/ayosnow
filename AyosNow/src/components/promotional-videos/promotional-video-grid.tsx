interface PromotionalVideoCard {
  embedUrl: string;
  title: string;
}

interface PromotionalVideoGridProps {
  videos: PromotionalVideoCard[];
  emptyTitle: string;
  emptyDescription: string;
}

export function PromotionalVideoGrid({
  videos,
  emptyTitle,
  emptyDescription,
}: PromotionalVideoGridProps) {
  if (videos.length === 0) {
    return (
      <section className="panel-shell grid min-h-52 place-items-center px-5 py-12 text-center">
        <div className="max-w-xl">
          <div
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-800"
            aria-hidden="true"
          >
            ▶
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950 sm:text-2xl">
            {emptyTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            {emptyDescription}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="PuntaGo promotional videos"
    >
      {videos.map((video, index) => (
        <article
          key={video.embedUrl}
          className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.55)] ${
            videos.length === 1 ? "md:col-span-2 md:mx-auto md:w-full md:max-w-3xl xl:col-span-3" : ""
          }`}
        >
          <div className="aspect-video w-full bg-slate-950">
            <iframe
              src={video.embedUrl}
              title={video.title}
              className="h-full w-full border-0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-black text-teal-800">
              {index + 1}
            </span>
            <h2 className="text-base font-black text-slate-950">{video.title}</h2>
          </div>
        </article>
      ))}
    </section>
  );
}

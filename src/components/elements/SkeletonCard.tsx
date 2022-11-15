const SkeletonCard = () => (
  <div className="h-36 drop-shadow rounded bg-white px-4 py-4">
    <div className="animate-pulse flex flex-col w-full h-full">
      <div className="h-4 bg-neutral-300 rounded"></div>
      <div className="h-4 bg-neutral-300 rounded mt-2"></div>

      <div className="flex space-x-2 w-full mt-auto">
        <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export default SkeletonCard;

import { useQueryClient } from "@tanstack/react-query";
// import { revalidateTag } from "next/cache";

const useCacheRevalidate = (tags?: string[]) => {
  const queryClient = useQueryClient();

  const clear = (_tags?: string[]) => {
    if (_tags) {
      //   _tags.map(revalidateTag);
      queryClient.invalidateQueries({
        queryKey: _tags,
      });
    } else if (tags && tags.length > 0) {
      //   tags.map(revalidateTag);
      queryClient.invalidateQueries({
        queryKey: tags,
      });
    }
  };

  return {
    clear,
  };
};

export default useCacheRevalidate;

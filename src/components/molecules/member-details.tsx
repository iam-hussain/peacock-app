import { AvatarGroup } from "../atoms/avatar-group";
import Box from "../ui/box";
import Typography from "../ui/typography";

import { GetMemberBySlugResponse } from "@/app/api/account/member/[slug]/route";
import { dateFormat, displayDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

// MemberDetails.tsx
export function MemberDetails({
  member,
  captureMode,
}: GetMemberBySlugResponse & { captureMode: boolean }) {
  return (
    <>
      <div
        className={cn(
          "hidden justify-end align-middle items-center flex-col pb-6 gap-2",
          {
            flex: captureMode,
          }
        )}
      >
        <Typography variant={"brandMini"} className="text-4xl">
          Peacock Club
        </Typography>
        <p className="test-sm text-foreground/80">{displayDateTime()}</p>
      </div>
      <Box preset={"row-center"}>
        <AvatarGroup
          className={"p-2"}
          src={member.avatar || ""}
          name={member.name}
          isLarge={true}
        />
        <div>
          <Typography variant={"h4"} className="">
            {member.name}
          </Typography>
          <p className="text-sm text-foreground/70 font-medium">
            {dateFormat(member.startAt)}
          </p>
        </div>
      </Box>
    </>
  );
}

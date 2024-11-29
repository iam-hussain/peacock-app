import { getMemberBySlug } from "@/actions/member";
import { AvatarGroup } from "@/components/atoms/avatar-group";
import Box from "@/components/ui/box";
import Typography from "@/components/ui/typography";
import { dateFormat } from "@/lib/date";

export default async function EachMember({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  const member = await getMemberBySlug(slug);

  return (
    <Box preset={"stack-start"}>
      {/* <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          {member.name}
        </Typography>
      </Box> */}
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <Box preset={"stack-center"}>
          <AvatarGroup
            className={"px-6"}
            src={member.avatar || ""}
            name={member.name}
            isLarge={true}
          />
          <Typography variant={"h4"} className="">
            {member.name}
          </Typography>
          <p>Since: {dateFormat(member.joined)}</p>
          <p>Since: {member.monthsPassedString}</p>
        </Box>
      </Box>
    </Box>
  );
}

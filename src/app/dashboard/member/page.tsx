import MemberAction from "@/components/templates/members-action";
import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";

export default async function Members() {
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Members
        </Typography>
        <CustomLink href="/dashboard/member/transaction" variant={"default"}>
          Member Transactions
        </CustomLink>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <MemberAction />
      </Box>
    </Box>
  );
}

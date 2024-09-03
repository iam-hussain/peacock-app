import Box from "@/components/ui/box";
import Typography from "@/components/ui/typography";
import { CustomLink } from "@/components/ui/link";
import VendorAction from "@/components/templates/vendor-action";

export default async function Vendors() {
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Vendors
        </Typography>
        <CustomLink href="/dashboard/vendor/transaction" variant={"default"}>
          Vendor Transactions
        </CustomLink>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <VendorAction />
      </Box>
    </Box>
  );
}

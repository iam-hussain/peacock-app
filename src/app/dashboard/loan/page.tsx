import LoanAction from "@/components/templates/loan-action";
import Box from "@/components/ui/box";
import Typography from "@/components/ui/typography";

export default async function Vendors() {
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Loans
        </Typography>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <LoanAction />
      </Box>
    </Box>
  );
}


import { Member, Passbook } from "@prisma/client";
import prisma from "@/db";
import { dateFormat, monthsDiff } from "@/lib/date";
import { memberTotalDepositAmount } from "@/lib/club";

type MemberToTransform = Member & {
    passbook: Passbook;
};

function membersTableTransform(
    member: MemberToTransform,
    memberTotalDeposit: number
) {
    const offsetBalance = member.passbook.offset - member.passbook.offsetIn;
    const periodBalance = memberTotalDeposit - member.passbook.periodIn;
    const deposit = member.passbook.periodIn + member.passbook.offsetIn;
    return {
        id: member.id,
        name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
        username: member.username,
        avatar: member.avatar
            ? `/image/${member.avatar}`
            : "/image/no_image_available.jpeg",
        joined: monthsDiff(new Date(), new Date(member.joinedAt)),
        joinedAt: dateFormat(member.joinedAt),
        status: member.active ? "Active" : "Disabled",
        active: member.active,
        deposit: deposit - member.passbook.out,
        periodIn: member.passbook.periodIn,
        offsetDeposit: member.passbook.offsetIn,
        offsetBalance,
        periodBalance,
        balance: periodBalance + offsetBalance,
        returns: member.passbook.returns || 0,
        clubFund: member.passbook.fund,
        netValue:
            member.passbook.in + member.passbook.returns - member.passbook.out,
    };
}

export async function getMembers() {
    const members = await prisma.member.findMany({
        include: {
            passbook: true,
        },
    });
    const memberTotalDeposit = memberTotalDepositAmount();
    const transformedMembers = members
        .map((each) => membersTableTransform(each, memberTotalDeposit))
        .sort((a, b) => (a.name > b.name ? 1 : -1));

    return transformedMembers
}


export type GetMembersResponse = Awaited<ReturnType<typeof getMembers>>;

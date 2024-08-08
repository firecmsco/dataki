export function getInitialDateRange(): [Date | null, Date | null] {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return [date, new Date()];
}

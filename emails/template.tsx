import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type MonthlyReportData = {
  month: string;
  stats: {
    totalIncome: number;
    totalExpenses: number;
    byCategory: Record<string, number>;
  };
  insights: string[];
};

type BudgetAlertData = {
  percentageUsed: number;
  budgetAmount: number;
  totalExpenses: number;
  accountName: string;
};

type EmailTemplateProps = {
  userName?: string;
  type?: "monthly-report" | "budget-alert";
  data?: MonthlyReportData | BudgetAlertData;
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {
    month: "",
    stats: { totalIncome: 0, totalExpenses: 0, byCategory: {} },
    insights: [],
  },
}: EmailTemplateProps) {
  if (type === "monthly-report") {
    const monthlyData = data as MonthlyReportData;
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {monthlyData?.month}:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Income</Text>
                <Text style={styles.heading}>
                  ${monthlyData?.stats.totalIncome}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Expenses</Text>
                <Text style={styles.heading}>
                  ${monthlyData?.stats.totalExpenses}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Net</Text>
                <Text style={styles.heading}>
                  $
                  {monthlyData?.stats.totalIncome -
                    monthlyData?.stats.totalExpenses}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {monthlyData?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(monthlyData?.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.text}>{category}</Text>
                      <Text style={styles.text}>${amount}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {monthlyData?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>JagaUang Insights</Heading>
                {monthlyData.insights.map((insight, index) => (
                  <Text key={index} style={styles.text}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using JagaUang. Keep tracking your finances for
              better financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Alert</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            {(() => {
              const budgetData = data as BudgetAlertData;
              return (
                <>
                  <Text style={styles.text}>
                    You&rsquo;ve used {budgetData.percentageUsed.toFixed(1)}% of
                    your monthly budget.
                  </Text>
                  <Section style={styles.statsContainer}>
                    <div style={styles.stat}>
                      <Text style={styles.text}>Budget Amount</Text>
                      <Text style={styles.heading}>
                        ${budgetData.budgetAmount}
                      </Text>
                    </div>
                    <div style={styles.stat}>
                      <Text style={styles.text}>Spent So Far</Text>
                      <Text style={styles.heading}>
                        ${budgetData.totalExpenses}
                      </Text>
                    </div>
                    <div style={styles.stat}>
                      <Text style={styles.text}>Remaining</Text>
                      <Text style={styles.heading}>
                        ${budgetData.budgetAmount - budgetData.totalExpenses}
                      </Text>
                    </div>
                  </Section>
                </>
              );
            })()}
          </Container>
        </Body>
      </Html>
    );
  }
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "32px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center" as const,
    marginTop: "32px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
};

/**
 * Tests for sendEmail utility
 */

import { sendEmail } from "@/lib/email";

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({
  sendMail: sendMailMock,
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: createTransportMock,
  },
}));

describe("sendEmail", () => {
  const baseEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...baseEnv,
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "user@example.com",
      SMTP_PASS: "password",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_FROM: "Sender <sender@example.com>",
    };
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = baseEnv;
  });

  it("sends email via SMTP transport", async () => {
    sendMailMock.mockResolvedValueOnce(undefined);

    await sendEmail({
      to: "recipient@example.com",
      subject: "SMTP Success Test",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "user@example.com",
        pass: "password",
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Sender <sender@example.com>",
      to: "recipient@example.com",
      subject: "SMTP Success Test",
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });

  it("throws formatted error when transport fails", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP down"));

    await expect(
      sendEmail({
        to: "recipient@example.com",
        subject: "SMTP Failure Test",
        html: "<p>Hello</p>",
      })
    ).rejects.toThrow("Failed to send email: SMTP down");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error sending email"),
      expect.any(Error)
    );
  });
});

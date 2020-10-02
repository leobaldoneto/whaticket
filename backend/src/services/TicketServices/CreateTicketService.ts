import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = await GetDefaultWhatsApp();

  if (!defaultWhatsapp) {
    throw new AppError("No default WhatsApp found. Check Connection page.");
  }

  await CheckContactOpenTickets(contactId);

  const { isGroup } = await ShowContactService(contactId);

  const { id }: Ticket = await defaultWhatsapp.$create("ticket", {
    contactId,
    status,
    isGroup,
    userId
  });

  const ticket = await Ticket.findByPk(id, { include: ["contact"] });

  if (!ticket) {
    throw new AppError("Error, ticket not created.");
  }

  return ticket;
};

export default CreateTicketService;

// import { Body, Controller, Post } from "@nestjs/common";
// import { Raw } from "typeorm";
// import { PaystackWebhookService } from "./webhook.service";

// // Controller to handle webhook
// @Controller('webhooks')
// export class PaystackWebhookController {
//   constructor(private readonly webhookService: PaystackWebhookService) {}

//   // @Post('paystack')
//   // async handlePaystackWebhook(
//   //   @new Headers('x-paystack-signature') signature: string,
//   //   @Raw() rawBody: Buffer,
//   //   @Body() body: PaystackEventData,
//   // ) {
//   //   await this.webhookService.handleWebhook(
//   //     signature,
//   //     rawBody.toString(),
//   //     body,
//   //   );
//   //   return { received: true };
//   // }
// }
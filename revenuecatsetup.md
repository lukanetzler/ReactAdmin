<!-- fullWidth: false tocVisible: false tableWrap: true -->
AI prompt from revenuecat

Help me integrate RevenueCat SDK into my PrayVail app. I need to:

1\. Install the RevenueCat SDK using Angular

   - npm: npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui

   - Documentation: https://www.revenuecat.com/docs/getting-started/installation/capacitor

2\. Configure it with my API key: test_GKdzMwRzmSDqrsgSloXdxKfrkXD

3\. Set up basic subscription functionality in Capacitor

4\. Set up entitlement checking for: PrayVail Supporter

5\. Handle customer info and purchases

6\. Configure products for my app:

\- Yearly (yearly)

\- Monthly (monthly)

Please provide step-by-step instructions for Capacitor implementation with Angular. Include:

\- Complete code examples

\- Error handling

\- Best practices for subscription management

\- Customer info retrieval

\- Entitlement checking for PrayVail Supporter

\- Present a RevenueCat Paywall (https://www.revenuecat.com/docs/tools/paywalls)

\- When it makes sense: Add support for Customer Center (https://www.revenuecat.com/docs/tools/customer-center)

\- Product configuration and offering setup

\- Make sure to implement it all using the best modern methods supported by the RevenueCat SDK.

Configure

import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

@Component({

  selector: 'app-root',

  templateUrl: 'app.component.html',

  styleUrls: \['app.component.scss'\],

})

export class AppComponent {

  constructor(private platform: Platform) {

    this.platform.ready().then(async () => {

      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      if (this.platform.is('ios')) {

        await Purchases.configure({ apiKey: "test_GKdzMwRzmSDqrsgSloXdxKfrkXD" });

      } else if (this.platform.is('android')) {

        await Purchases.configure({ apiKey: "test_GKdzMwRzmSDqrsgSloXdxKfrkXD" });

      }

    });

  }

}

Check entitlement

import { Purchases } from '@revenuecat/purchases-capacitor';

try {

    const { customerInfo } = await Purchases.getCustomerInfo();

    if(typeof customerInfo.entitlements.active\["PrayVail Supporter"\] !== "undefined") {

      // Grant user access to entitlement

    }

} catch (e) {

  // Error fetching customer info

}

Present Paywall

import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

// Make sure to configure a Paywall in the Dashboard first.

async function presentPaywall(): Promise<boolean> {

    // Present paywall for current offering:

    const { result } = await RevenueCatUI.presentPaywall();

    // Handle result if needed.

    switch (result) {

        case PAYWALL_RESULT.NOT_PRESENTED:

        case PAYWALL_RESULT.ERROR:

        case PAYWALL_RESULT.CANCELLED:

            return false;

        case PAYWALL_RESULT.PURCHASED:

        case PAYWALL_RESULT.RESTORED:

            return true;

        default:

            return false;

    }

}
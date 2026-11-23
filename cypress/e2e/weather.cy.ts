// Runs against `npm run dev` and a local deepdiary-backend, with real forecasts from MET Norway.

describe('Weather', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('searches for a place and shows its forecast, then remembers it', () => {
    cy.contains('h1', 'Plan around the weather')

    cy.findSearch().type('Durban')
    cy.get('[role="option"]').first().should('contain', 'Durban').and('contain', 'South Africa').click()

    cy.contains('h1', 'Durban')
    cy.contains(/Rain likely from \d\d:\d\d|Dry for the next 24 hours/)
    cy.get('[aria-label="Hourly forecast"] > li').should('have.length', 24)
    cy.contains('h2', /Next \d+ days/)
    cy.get('.day').should('have.length.at.least', 8).first().should('contain', 'Today')
    cy.contains('MET Norway')

    cy.reload()
    cy.contains('h1', 'Durban')
  })

  it('keeps recent places one tap away and lets you remove them', () => {
    cy.findSearch().type('Cape Town{enter}')
    cy.contains('h1', 'Cape Town')
    cy.findSearch().type('London')
    cy.get('[role="option"]').first().should('contain', 'United Kingdom')
    cy.findSearch().type('{enter}')
    cy.contains('h1', 'London')

    cy.get('[aria-label="Recent places"]').contains('button', 'Cape Town').click()
    cy.contains('h1', 'Cape Town')

    cy.get('[aria-label="Remove Cape Town, South Africa"]').click()
    cy.contains('h1', 'London')
    cy.get('[aria-label="Recent places"]').should('not.exist')
  })

  it('fits a phone screen without sideways scrolling', () => {
    cy.viewport(375, 812)
    cy.findSearch().type('Durban{enter}')
    cy.get('.day').should('have.length.at.least', 8)
    cy.get('.day-condition').first().should('not.be.visible')
    cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(375))
  })

  it('tells you when nothing matches', () => {
    cy.findSearch().type('Qqqzzz')
    cy.contains('No towns or cities match "Qqqzzz".')
  })

  it('gets forecasts from deepdiary-backend with MET\'s cache lifetime', () => {
    cy.request('/api/public/weather/forecast?lat=-33.92&lon=18.42').then(response => {
      expect(response.status).to.eq(200)
      expect(response.headers['cache-control']).to.match(/^max-age=\d+, public$/)
      expect(response.body.properties.timeseries.length).to.be.greaterThan(40)
    })
    cy.request({ url: '/api/public/weather/forecast?lat=nope', failOnStatusCode: false }).its('status').should('eq', 400)
  })
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      findSearch(): Chainable<JQuery<HTMLInputElement>>
    }
  }
}

Cypress.Commands.add('findSearch', () => cy.get<HTMLInputElement>('input[role="combobox"]'))

export {}
